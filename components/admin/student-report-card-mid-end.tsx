import type React from "react"

interface ReportCardProps {
  data: {
    student: {
      id: string
      name: string
      rollNum: string
      gender: string
      photo?: string
      class: string
      year: string
    }
    school: {
      name: string
      id: string
    }
    term: {
      id: string
      name: string
      year: string
      nextTermStarts: string
      nextTermEnds: string
    }
    subjects: {
      id: string
      name: string
      fullMarks: number
      midTerm: {
        marks: number
        grade: string
        percentage: number
      }
      endTerm: {
        marks: number
        grade: string
        percentage: number
      }
      teacherComment: string
      teacherInitials: string
    }[]
    performance: {
      midTerm: {
        total: number
        average: number
        grade: string
        division: string
      }
      endTerm: {
        total: number
        average: number
        grade: string
        division: string
      }
    }
    conduct: {
      discipline: string
      timeManagement: string
      smartness: string
      attendanceRemarks: string
      attendancePercentage?: number
    }
    comments: {
      classTeacher: string
      headTeacher: string
    }
    gradingScale: {
      id: string
      from: number
      to: number
      grade: string
      comment: string
    }[]
  }
}

export const StudentReportCardMidEnd: React.FC<ReportCardProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Calculate division based on grade number
  const calculateDivision = (gradeStr: string) => {
    // Extract number from grade (e.g., "A+" -> get position in grading scale)
    const grade = data.gradingScale.find((g) => g.grade === gradeStr)
    if (!grade) return "X"

    const gradeNumber = data.gradingScale.length - data.gradingScale.findIndex((g) => g.grade === gradeStr)

    if (gradeNumber >= 4 && gradeNumber <= 12) return "I"
    if (gradeNumber >= 13 && gradeNumber <= 24) return "II"
    if (gradeNumber >= 25 && gradeNumber <= 28) return "III"
    if (gradeNumber >= 29 && gradeNumber <= 32) return "IV"
    if (gradeNumber >= 33 && gradeNumber <= 36) return "U"
    return "X"
  }

  const gradingScale = data.gradingScale || []
  const subjects = data.subjects || []

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="report-card bg-white p-4 print:p-0 min-h-[297mm]">
        {/* School Header */}
        <div className="bg-sky-100 border-2 border-black p-4 text-center">
          <h1 className="text-2xl font-bold uppercase">{data.school?.name || "School Name"}</h1>
          <div className="flex justify-center items-center gap-4">
            <div className="flex-1 text-right">
              <p>P.O.BOX 31007</p>
              <p>"Arise and shine"</p>
            </div>
            <div className="w-20 h-20 border flex items-center justify-center">
              <img
                src="/log.jpg"
                alt="School Logo"
                className="object-contain rounded-full w-full h-full"
                crossOrigin="anonymous"
              />
            </div>
            <div className="flex-1 text-left">
              <p>TEL: 0753753179, 0773297951</p>
              <p>Email: schoolvvumba@gmail.com</p>
            </div>
          </div>
          <p className="mt-2 font-semibold">"A Centre for Guaranteed excellence"</p>
          <div className="h-1 bg-black my-2"></div>
          <div className="border-2 border-black inline-block px-8 py-1 bg-sky-200">
            <h2 className="text-xl font-bold uppercase">
              MID & END TERM {data.term?.name || "TERM"} ASSESSMENT REPORT
            </h2>
          </div>
        </div>

        {/* Student Information */}
        <div className="mt-4 border-2 border-black p-4 bg-sky-100">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-9">
              <div className="flex">
                <p className="font-bold mr-2">PUPIL'S NAME:</p>
                <p className="uppercase underline flex-1">{data.student?.name || "N/A"}</p>
                <p className="font-bold mr-2">CLASS:</p>
                <p className="uppercase underline">{data.student?.class || "N/A"}</p>
              </div>
              <div className="flex mt-2">
                <p className="font-bold mr-2">SEX:</p>
                <p className="uppercase underline w-8">{data.student?.gender?.charAt(0) || "M"}</p>
                <p className="font-bold mr-2">YEAR:</p>
                <p className="uppercase underline w-16">{data.term?.year || new Date().getFullYear()}</p>
                <p className="font-bold mr-2">LIN NO:</p>
                <p className="uppercase underline flex-1">{data.student?.rollNum || "N/A"}</p>
                <p className="font-bold mr-2">DIV:</p>
                <p className="uppercase underline w-16">{data.performance?.endTerm?.division || "N/A"}</p>
              </div>
            </div>
            <div className="col-span-3 flex justify-center">
              <div className="w-24 h-32 border-2 border-black overflow-hidden">
                {data.student?.photo ? (
                  <img
                    src={data.student.photo || "/placeholder.svg"}
                    alt={data.student?.name || "Student"}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    No Photo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Results */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black bg-sky-100">
            <thead>
              <tr>
                <th className="border-2 border-black p-2 text-left">SUBJECT</th>
                <th className="border-2 border-black p-2 text-center">FULL MARKS</th>
                <th colSpan={3} className="border-2 border-black p-2 text-center">
                  MID TERM {data.term?.name || "TERM"} EXAMS
                </th>
                <th colSpan={3} className="border-2 border-black p-2 text-center">
                  END OF TERM {data.term?.name || "TERM"} EXAMS
                </th>
                <th className="border-2 border-black p-2 text-center">TEACHER'S COMMENT</th>
                <th className="border-2 border-black p-2 text-center">INITIALS</th>
              </tr>
              <tr>
                <th className="border-2 border-black p-2"></th>
                <th className="border-2 border-black p-2"></th>
                <th className="border-2 border-black p-2 text-center">MARKS</th>
                <th className="border-2 border-black p-2 text-center">AGG</th>
                <th className="border-2 border-black p-2 text-center">DIV</th>
                <th className="border-2 border-black p-2 text-center">MARKS</th>
                <th className="border-2 border-black p-2 text-center">AGG</th>
                <th className="border-2 border-black p-2 text-center">DIV</th>
                <th className="border-2 border-black p-2"></th>
                <th className="border-2 border-black p-2"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.length > 0 ? (
                subjects.map((subject, index) => (
                  <tr key={subject.id}>
                    <td className="border-2 border-black p-2">{subject.name?.toUpperCase() || "N/A"}</td>
                    <td className="border-2 border-black p-2 text-center">{subject.fullMarks || 100}</td>
                    <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                      {subject.midTerm?.marks || 0}
                    </td>
                    <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                      {subjects.filter((s) => (s.midTerm?.marks || 0) > (subject.midTerm?.marks || 0)).length + 1}
                    </td>
                    <td className="border-2 border-black p-2 text-center">
                      {calculateDivision(subject.midTerm?.grade || "F")}
                    </td>
                    <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                      {subject.endTerm?.marks || 0}
                    </td>
                    <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                      {subjects.filter((s) => (s.endTerm?.marks || 0) > (subject.endTerm?.marks || 0)).length + 1}
                    </td>
                    <td className="border-2 border-black p-2 text-center">
                      {calculateDivision(subject.endTerm?.grade || "F")}
                    </td>
                    <td className="border-2 border-black p-2 text-center text-blue-600">
                      {subject.teacherComment || "Good"}
                    </td>
                    <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                      {subject.teacherInitials || "T.I."}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="border-2 border-black p-4 text-center text-gray-500">
                    No subjects data available
                  </td>
                </tr>
              )}
              <tr>
                <td className="border-2 border-black p-2 font-bold">TOTAL MARKS</td>
                <td className="border-2 border-black p-2 text-center font-bold">{subjects.length * 100}</td>
                <td className="border-2 border-black p-2 text-center font-bold">
                  {data.performance?.midTerm?.total || 0}
                </td>
                <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                  {subjects.reduce(
                    (sum, subject) =>
                      sum +
                      (subjects.filter((s) => (s.midTerm?.marks || 0) > (subject.midTerm?.marks || 0)).length + 1),
                    0,
                  )}
                </td>
                <td className="border-2 border-black p-2 text-center font-bold">
                  {data.performance?.midTerm?.division || "N/A"}
                </td>
                <td className="border-2 border-black p-2 text-center font-bold">
                  {data.performance?.endTerm?.total || 0}
                </td>
                <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                  {subjects.reduce(
                    (sum, subject) =>
                      sum +
                      (subjects.filter((s) => (s.endTerm?.marks || 0) > (subject.endTerm?.marks || 0)).length + 1),
                    0,
                  )}
                </td>
                <td className="border-2 border-black p-2 text-center font-bold">
                  {data.performance?.endTerm?.division || "N/A"}
                </td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Student Conduct */}
        <div className="mt-4">
          <h3 className="text-center text-xl font-bold uppercase bg-sky-100 border-2 border-black py-2">
            PUPIL'S GENERAL CONDUCT
          </h3>
          <table className="w-full border-collapse border-2 border-black bg-sky-100">
            <thead>
              <tr>
                <th className="border-2 border-black p-2 text-center">DISCIPLINE</th>
                <th className="border-2 border-black p-2 text-center">TIME MANAGEMENT</th>
                <th className="border-2 border-black p-2 text-center">SMARTNESS</th>
                <th className="border-2 border-black p-2 text-center">ATTENDANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                  {data.conduct?.discipline || "Good"}
                </td>
                <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                  {data.conduct?.timeManagement || "Good"}
                </td>
                <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                  {data.conduct?.smartness || "Good"}
                </td>
                <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                  {data.conduct?.attendanceRemarks || "Regular"}
                  {data.conduct?.attendancePercentage && ` (${data.conduct.attendancePercentage}%)`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Teacher Comments */}
        <div className="mt-4 bg-sky-100 border-2 border-black p-4">
          <div className="mb-4">
            <p className="inline-block">Class teacher's Comment: </p>
            <span className="text-blue-600 font-bold">{data.comments?.classTeacher || "Good performance"}</span>
            <p className="inline-block ml-8">Signature:</p>
            <span className="ml-2 italic">_______________</span>
          </div>
          <div>
            <p className="inline-block">Head teacher's Comment: </p>
            <span className="text-blue-600 font-bold">{data.comments?.headTeacher || "Keep up the good work"}</span>
            <p className="inline-block ml-8">Signature:</p>
            <span className="ml-2 italic">_______________</span>
          </div>
        </div>

        {/* Grading Scale */}
        {gradingScale.length > 0 && (
          <div className="mt-4">
            <h3 className="text-center text-xl font-bold uppercase underline">GRADING SCALE</h3>
            <div className="overflow-x-auto mt-2">
              <table className="w-full border-collapse border-2 border-black bg-sky-100">
                <thead>
                  <tr>
                    {gradingScale.map((grade) => (
                      <th key={grade.id} className="border-2 border-black p-2 text-center">
                        {grade.from} - {grade.to}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {gradingScale.map((grade) => (
                      <td key={grade.id} className="border-2 border-black p-2 text-center font-bold">
                        {grade.grade}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Next Term Information */}
        <div className="mt-4 bg-sky-100 border-2 border-black p-4">
          <p className="text-center">
            Next term Begins on <span className="font-bold underline">{formatDate(data.term?.nextTermStarts)}</span> and
            ends on <span className="font-bold underline">{formatDate(data.term?.nextTermEnds)}</span>
          </p>
          <p className="text-center mt-4 font-bold italic">THIS REPORT IS NOT VALID WITHOUT A SCHOOL STAMP</p>
        </div>
      </div>
    </div>
  )
}

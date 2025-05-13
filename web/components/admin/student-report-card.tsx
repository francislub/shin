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
      }
      endTerm: {
        marks: number
        grade: string
      }
      teacherComment: string
      teacherInitials: string
    }[]
    performance: {
      midTerm: {
        total: number
        average: number
        grade: string
      }
      endTerm: {
        total: number
        average: number
        grade: string
      }
    }
    conduct: {
      discipline: string
      timeManagement: string
      smartness: string
      attendanceRemarks: string
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

export const StudentReportCard: React.FC<ReportCardProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="report-card bg-white p-4 print:p-0">
      {/* School Header */}
      <div className="bg-sky-100 border-2 border-black p-4 text-center">
        <h1 className="text-2xl font-bold uppercase">{data.school.name}</h1>
        <div className="flex justify-center items-center gap-4">
          <div className="flex-1 text-right">
            <p>P.O.BOX 31007</p>
            <p>"Arise and shine"</p>
          </div>
          <div className="w-20 h-20 bg-white border border-black flex items-center justify-center">
            <span className="text-xs">SCHOOL LOGO</span>
          </div>
          <div className="flex-1 text-left">
            <p>TEL: 0753753179, 0773297951</p>
            <p>Email: school@example.com</p>
          </div>
        </div>
        <p className="mt-2 font-semibold">"A Centre for Guaranteed excellence"</p>
        <div className="h-1 bg-black my-2"></div>
        <div className="border-2 border-black inline-block px-8 py-1 bg-sky-200">
          <h2 className="text-xl font-bold uppercase">END OF {data.term.name} ASSESSMENT REPORT</h2>
        </div>
      </div>

      {/* Student Information */}
      <div className="mt-4 border-2 border-black p-4 bg-sky-100">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9">
            <div className="flex">
              <p className="font-bold mr-2">PUPIL'S NAME:</p>
              <p className="uppercase underline flex-1">{data.student.name}</p>
              <p className="font-bold mr-2">CLASS:</p>
              <p className="uppercase underline">{data.student.class}</p>
            </div>
            <div className="flex mt-2">
              <p className="font-bold mr-2">SEX:</p>
              <p className="uppercase underline w-8">{data.student.gender?.charAt(0) || "M"}</p>
              <p className="font-bold mr-2">YEAR:</p>
              <p className="uppercase underline w-16">{data.term.year}</p>
              <p className="font-bold mr-2">LIN NO:</p>
              <p className="uppercase underline flex-1">{data.student.rollNum}</p>
              <p className="font-bold mr-2">DIV:</p>
              <p className="uppercase underline w-16">{data.performance.endTerm.grade}</p>
            </div>
          </div>
          <div className="col-span-3 flex justify-center">
            <div className="w-24 h-32 border-2 border-black overflow-hidden">
              {data.student.photo ? (
                <img
                  src={data.student.photo || "/placeholder.svg"}
                  alt={data.student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">No Photo</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Results */}
      <div className="mt-4">
        <table className="w-full border-collapse border-2 border-black bg-sky-100">
          <thead>
            <tr>
              <th className="border-2 border-black p-2 text-left">SUBJECT</th>
              <th className="border-2 border-black p-2 text-center">FULL MARKS</th>
              <th colSpan={3} className="border-2 border-black p-2 text-center">
                MID TERM {data.term.name} EXAMS
              </th>
              <th colSpan={3} className="border-2 border-black p-2 text-center">
                END OF TERM {data.term.name} EXAMS
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
            {data.subjects.map((subject) => (
              <tr key={subject.id}>
                <td className="border-2 border-black p-2">{subject.name.toUpperCase()}</td>
                <td className="border-2 border-black p-2 text-center">{subject.fullMarks}</td>
                <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                  {subject.midTerm.marks}
                </td>
                <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                  {data.subjects.findIndex((s) => s.midTerm.marks > subject.midTerm.marks) + 1}
                </td>
                <td className="border-2 border-black p-2 text-center">{subject.midTerm.grade}</td>
                <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                  {subject.endTerm.marks}
                </td>
                <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                  {data.subjects.findIndex((s) => s.endTerm.marks > subject.endTerm.marks) + 1}
                </td>
                <td className="border-2 border-black p-2 text-center">{subject.endTerm.grade}</td>
                <td className="border-2 border-black p-2 text-center text-blue-600">{subject.teacherComment}</td>
                <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                  {subject.teacherInitials}
                </td>
              </tr>
            ))}
            <tr>
              <td className="border-2 border-black p-2 font-bold">TOTAL MARKS</td>
              <td className="border-2 border-black p-2 text-center font-bold">{data.subjects.length * 100}</td>
              <td className="border-2 border-black p-2 text-center font-bold">{data.performance.midTerm.total}</td>
              <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                {data.subjects.reduce(
                  (sum, subject) => sum + (data.subjects.findIndex((s) => s.midTerm.marks > subject.midTerm.marks) + 1),
                  0,
                )}
              </td>
              <td className="border-2 border-black p-2"></td>
              <td className="border-2 border-black p-2 text-center font-bold">{data.performance.endTerm.total}</td>
              <td className="border-2 border-black p-2 text-center text-red-600 font-bold">
                {data.subjects.reduce(
                  (sum, subject) => sum + (data.subjects.findIndex((s) => s.endTerm.marks > subject.endTerm.marks) + 1),
                  0,
                )}
              </td>
              <td className="border-2 border-black p-2"></td>
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
                {data.conduct.discipline}
              </td>
              <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                {data.conduct.timeManagement}
              </td>
              <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                {data.conduct.smartness}
              </td>
              <td className="border-2 border-black p-2 text-center text-blue-600 font-bold">
                {data.conduct.attendanceRemarks}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Teacher Comments */}
      <div className="mt-4 bg-sky-100 border-2 border-black p-4">
        <div className="mb-4">
          <p className="inline-block">Class teacher's Comment: </p>
          <span className="text-blue-600 font-bold">{data.comments.classTeacher}</span>
          <p className="inline-block ml-8">Signature:</p>
          <span className="ml-2 italic">_______________</span>
        </div>
        <div>
          <p className="inline-block">Head teacher's Comment: </p>
          <span className="text-blue-600 font-bold">{data.comments.headTeacher}</span>
          <p className="inline-block ml-8">Signature:</p>
          <span className="ml-2 italic">_______________</span>
        </div>
      </div>

      {/* Grading Scale */}
      <div className="mt-4">
        <h3 className="text-center text-xl font-bold uppercase underline">GRADING SCALE</h3>
        <table className="w-full border-collapse border-2 border-black bg-sky-100 mt-2">
          <thead>
            <tr>
              {data.gradingScale.map((grade) => (
                <th key={grade.id} className="border-2 border-black p-2 text-center">
                  {grade.from} - {grade.to}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {data.gradingScale.map((grade) => (
                <td key={grade.id} className="border-2 border-black p-2 text-center font-bold">
                  {grade.grade}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Next Term Information */}
      <div className="mt-4 bg-sky-100 border-2 border-black p-4">
        <p className="text-center">
          Next term Begins on <span className="font-bold underline">{formatDate(data.term.nextTermStarts)}</span> and
          ends on <span className="font-bold underline">{formatDate(data.term.nextTermEnds)}</span>
        </p>
        <p className="text-center mt-4 font-bold italic">THIS REPORT IS NOT VALID WITHOUT A SCHOOL STAMP</p>
      </div>
    </div>
  )
}
